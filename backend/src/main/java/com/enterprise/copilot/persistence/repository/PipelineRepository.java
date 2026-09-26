package com.enterprise.copilot.persistence.repository;

import com.enterprise.copilot.persistence.entity.PipelineEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PipelineRepository
        extends JpaRepository<PipelineEntity, UUID> {

    List<PipelineEntity> findAllByOrderByCreatedAtDesc();

}